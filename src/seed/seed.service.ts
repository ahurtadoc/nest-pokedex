import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { PokeResponse } from './interfaces/poke-response.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from '../pokemon/entities/pokemon.entity';
import { Model } from 'mongoose';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly httpService: HttpService
  ) {}
  async execute() {
    await this.pokemonModel.deleteMany({});
    const { data } = await firstValueFrom(
      this.httpService
        .get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=151')
        .pipe(
          catchError((error: AxiosError) => {
            console.error(error.response.data);
            throw 'An error happened!';
          })
        )
    );
    const pokemonToInsert = data.results
      .map(({ name, url }) => {
        const segments = url.split('/');
        const no = +segments[segments.length - 2];
        return { name, no };
      })
      .filter((pokemon) => Boolean(pokemon));
    await this.pokemonModel.insertMany(pokemonToInsert);

    return 'Seeding completed!';
  }
}

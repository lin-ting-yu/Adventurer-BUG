import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ThreeContainerComponent } from './three-container/three-container.component';
import { WorldContainerComponent } from './world-container/world-container.component';

@NgModule({
  declarations: [
    AppComponent,
    ThreeContainerComponent,
    WorldContainerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
